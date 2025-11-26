"use client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClientSupabase } from "@/lib/supabase";
import { aiService } from "@/lib/ai-service";
import { renderFootballData } from "@/lib/data-renderers";
import { downloadJSON, downloadCSV, downloadExcel, generateFilename } from "@/lib/export-utils";
import { Toast } from "@/components/Toast";
import styles from "./dashboard.module.css";

interface Profile {
  email: string;
  token_balance: number;
  role: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ 
      role: string; 
      content: string; 
      htmlContent?: string;
      rawData?: any;
      intent?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [selectedApi, setSelectedApi] = useState<'football-api' | 'sofascore'>('football-api');
  const [showApiMenu, setShowApiMenu] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showApiMenu && !(event.target as Element).closest(`.${styles.apiSelector}`)) {
        setShowApiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showApiMenu]);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClientSupabase();
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) {
        console.log("Profile loaded:", profileData); // DEBUG: Check role
        setProfile(profileData);
      } else {
        console.log("No profile data found", profileError);
      }

      // Load conversations
      loadConversations();
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const updateTokenBalance = async () => {
    if (!user) return;

    const supabase = createClientSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("token_balance")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile((prev) =>
        prev ? { ...prev, token_balance: data.token_balance } : null
      );
    }
  };

  const handleSendMessage = async (messageOverride?: string) => {
    const message = (messageOverride || chatInput).trim();
    if (!message || loading) return;

    if (profile && profile.token_balance < 5) {
      setToast({
        message:
          "¡Sin tokens! Necesitas al menos 5 tokens para hacer consultas. Actualiza a Premium para tokens ilimitados o contacta al administrador.",
        type: "warning",
      });
      return;
    }

    // Create conversation if this is the first message
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation(message);
      if (!conversationId) {
        setToast({ message: "Error al crear conversación", type: "error" });
        return;
      }
    }

    // Add user message
    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setShowWelcome(false);
    setLoading(true);

    // Save user message to conversation
    await saveMessageToConversation(conversationId, "user", message);

    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
    }

    try {
      const startTime = Date.now();

      // Process query
      const queryData = await aiService.processUserQuery(message);

      // Execute Football API query
      if (!queryData.intent) {
        throw new Error("No se pudo determinar la intención de la consulta");
      }
      const apiResponse = await aiService.executeFootballQuery(
        queryData.intent,
        queryData.entities,
        selectedApi
      );

      const responseTime = Date.now() - startTime;

      // Render response
      const renderedData = renderFootballData(apiResponse, queryData.intent);

      // Add assistant response
      const assistantMessage = {
        role: "assistant",
        content: "",
        htmlContent: renderedData,
        rawData: apiResponse,
        intent: queryData.intent
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to conversation
      await saveMessageToConversation(
        conversationId,
        "assistant",
        renderedData
      );

      // Save query to Supabase
      await saveQuery(message, queryData, apiResponse, responseTime);

      // Update token balance
      await updateTokenBalance();

      setToast({ message: "Consulta exitosa", type: "success" });
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: `❌ Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setToast({ message: "Error al procesar la consulta", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const saveQuery = async (
    queryText: string,
    queryData: any,
    apiResponse: any,
    responseTime: number
  ) => {
    if (!user) return;

    try {
      const supabase = createClientSupabase();
      const { data, error } = await supabase.rpc("consume_tokens", {
        p_user_id: user.id,
        p_tokens: 5,
        p_query_text: queryText,
        p_intent: queryData.intent,
        p_entities: queryData.entities,
        p_response_data: apiResponse,
        p_response_time_ms: responseTime,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Error al guardar query");
      }
    } catch (error) {
      console.error("Error saving query:", error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    const supabase = createClientSupabase();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data && !error) {
      setConversations(data);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    const supabase = createClientSupabase();

    // Delete all messages first (CASCADE should handle this, but being explicit)
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);

    // Delete the conversation
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (!error) {
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
        setShowWelcome(true);
      }
      setToast({ message: "Conversación eliminada", type: "success" });
    } else {
      setToast({ message: "Error al eliminar conversación", type: "error" });
    }
  };

  const createNewConversation = async (firstMessage: string) => {
    if (!user) return null;

    // Check conversation limit (20 max for free users)
    if (conversations.length >= 20) {
      setToast({
        message:
          "¡Has alcanzado el límite de 20 conversaciones! Elimina algunas o actualiza a Premium para conversaciones ilimitadas.",
        type: "warning",
      });
      return null;
    }

    const supabase = createClientSupabase();
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title:
          firstMessage.substring(0, 50) +
          (firstMessage.length > 50 ? "..." : ""),
      })
      .select()
      .single();

    if (data && !error) {
      setConversations((prev) => [data, ...prev]);
      setCurrentConversationId(data.id);
      return data.id;
    }

    return null;
  };

  const switchConversation = async (conversationId: string) => {
    if (!user) return;

    setCurrentConversationId(conversationId);
    setShowWelcome(false);

    // Load messages for this conversation
    const supabase = createClientSupabase();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data && !error) {
      const loadedMessages = data.map((msg) => {
        // For assistant messages, the content IS the HTML
        // For user messages, content is plain text
        if (msg.role === "assistant") {
          return {
            role: msg.role,
            content: "", // Don't show duplicate text
            htmlContent: msg.content, // This is the rendered HTML
          };
        } else {
          return {
            role: msg.role,
            content: msg.content,
            htmlContent: undefined,
          };
        }
      });
      setMessages(loadedMessages);
    }
  };

  const saveMessageToConversation = async (
    conversationId: string,
    role: string,
    content: string
  ) => {
    if (!user) return;

    const supabase = createClientSupabase();
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
    });
  };

  const handleLogout = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleNewChat = async () => {
    setMessages([]);
    setShowWelcome(true);
    setChatInput("");
    setCurrentConversationId(null);
  };

  const handleSuggestionClick = (query: string) => {
    // Pass the query directly to handleSendMessage to avoid state update race condition
    handleSendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  if (!user || !profile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, hsl(220, 30%, 10%) 0%, hsl(220, 30%, 5%) 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              animation: "spin 2s linear infinite",
            }}
          >
            ⚽
          </div>
          <div style={{ fontSize: "1.125rem", opacity: 0.8 }}>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                <span>{profile.email.charAt(0).toUpperCase()}</span>
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userEmail}>{profile.email}</div>
                <div className={styles.userTokens}>
                  <span className={styles.tokenIcon}>🪙</span>
                  <span>{profile.token_balance} tokens</span>
                </div>
              </div>
            </div>
          </div>

          <button className={styles.btnNewChat} onClick={handleNewChat}>
            <span>➕</span>
            <span>Nueva Conversación</span>
          </button>

          {/* Conversation History */}
          <div className={styles.conversationList}>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`${styles.conversationItem} ${
                    currentConversationId === conv.id ? styles.active : ""
                  }`}
                  onClick={() => switchConversation(conv.id)}
                  title={conv.title}
                >
                  <span className={styles.conversationIcon}>💬</span>
                  <span className={styles.conversationTitle}>{conv.title}</span>
                  <button
                    className={styles.deleteConvBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('¿Eliminar esta conversación?')) {
                        deleteConversation(conv.id)
                      }
                    }}
                    title="Eliminar conversación"
                  >
                    🗑️
                  </button>
                </button>
              ))
            ) : (
              <div className={styles.noConversations}>
                <p>No hay conversaciones aún</p>
              </div>
            )}
          </div>

          <div className={styles.sidebarFooter}>
            {profile?.role === "admin" && (
              <button
                className={styles.sidebarBtn}
                onClick={() => router.push("/admin")}
              >
                <span>🔧</span>
                <span>Panel Admin</span>
              </button>
            )}
            <button className={styles.sidebarBtn} onClick={handleLogout}>
              <span>🚪</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <header className={styles.dashboardHeader}>
            <div className={styles.headerLeft}>
              <h1>
                <Image
                  src="/logo.png"
                  alt="Football Assistant"
                  width={40}
                  height={40}
                  style={{ verticalAlign: "middle", marginRight: "10px" }}
                />
                Football Assistant
              </h1>
              <p className={styles.headerSubtitle}>
                Consulta datos de fútbol en lenguaje natural
              </p>
            </div>
          </header>

          {/* Chat Area */}
          <div className={styles.chatArea}>
            {/* Welcome Screen */}
            {showWelcome && (
              <div className={styles.welcomeScreen}>
                <div className={styles.welcomeContent}>
                  <div className={styles.welcomeIcon}>
                    <Image
                      src="/logo.png"
                      alt="Football Assistant"
                      width={100}
                      height={100}
                    />
                  </div>
                  <h2>Bienvenido a Football Assistant</h2>
                  <p>Haz consultas sobre fútbol en lenguaje natural</p>

                  <div className={styles.suggestionCards}>
                    <button
                      className={styles.suggestionCard}
                      onClick={() =>
                        handleSuggestionClick("partidos de colombia")
                      }
                    >
                      <span className={styles.cardIcon}>🇨🇴</span>
                      <span className={styles.cardText}>
                        Partidos de Colombia
                      </span>
                    </button>
                    <button
                      className={styles.suggestionCard}
                      onClick={() =>
                        handleSuggestionClick(
                          "clasificacion de la premier league"
                        )
                      }
                    >
                      <span className={styles.cardIcon}>📊</span>
                      <span className={styles.cardText}>
                        Clasificación Premier League
                      </span>
                    </button>
                    <button
                      className={styles.suggestionCard}
                      onClick={() =>
                        handleSuggestionClick("goleadores de la liga")
                      }
                    >
                      <span className={styles.cardIcon}>⚽</span>
                      <span className={styles.cardText}>
                        Goleadores La Liga
                      </span>
                    </button>
                    <button
                      className={styles.suggestionCard}
                      onClick={() => handleSuggestionClick("partidos en vivo")}
                    >
                      <span className={styles.cardIcon}>🔴</span>
                      <span className={styles.cardText}>Partidos en vivo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {!showWelcome && (
              <div className={styles.chatMessages} ref={chatMessagesRef}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.message} ${
                      styles[msg.role + "Message"]
                    }`}
                  >
                    <div className={styles.messageAvatar}>
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div className={styles.messageContent}>
                      <p>{msg.content}</p>
                      {msg.htmlContent && (
                        <>
                          <div
                            dangerouslySetInnerHTML={{ __html: msg.htmlContent }}
                          />
                          {msg.rawData && msg.intent && (
                            <div className={styles.exportButtons}>
                              <button
                                className={styles.exportBtn}
                                onClick={() => downloadJSON(msg.rawData, generateFilename(msg.intent || 'data'))}
                                title="Descargar JSON"
                              >
                                📄 JSON
                              </button>
                              <button
                                className={styles.exportBtn}
                                onClick={() => downloadCSV(msg.rawData, generateFilename(msg.intent || 'data'))}
                                title="Descargar CSV"
                              >
                                📊 CSV
                              </button>
                              <button
                                className={styles.exportBtn}
                                onClick={() => downloadExcel(msg.rawData, generateFilename(msg.intent || 'data'))}
                                title="Descargar Excel"
                              >
                                📗 Excel
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {loading && (
              <div className={styles.typingIndicator}>
                <div className={styles.messageAvatar}>🤖</div>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}


          {/* Chat Input */}
          <div className={styles.chatInputContainer}>
            <div className={styles.inputWrapper}>
              
              {/* API Selector */}
              <div className={styles.apiSelector}>
                <button 
                  className={styles.apiSelectorBtn}
                  onClick={() => setShowApiMenu(!showApiMenu)}
                  title="Seleccionar fuente de datos"
                >
                  <span>{selectedApi === 'football-api' ? '⚽ API-Football' : 'S Sofascore'}</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>
                </button>
                
                {showApiMenu && (
                  <div className={styles.apiMenu}>
                    <button 
                      className={`${styles.apiMenuItem} ${selectedApi === 'football-api' ? styles.active : ''}`}
                      onClick={() => { setSelectedApi('football-api'); setShowApiMenu(false); }}
                    >
                      <span>⚽</span> API-Football
                    </button>
                    <button 
                      className={`${styles.apiMenuItem} ${selectedApi === 'sofascore' ? styles.active : ''}`}
                      onClick={() => { setSelectedApi('sofascore'); setShowApiMenu(false); }}
                    >
                      <span>S</span> Sofascore
                    </button>
                  </div>
                )}
              </div>

              <textarea
                ref={chatInputRef}
                // ... existing props ...
                value={chatInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.chatInput}
                placeholder="Ej: partidos de colombia"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                className={styles.sendBtn}
                disabled={loading || !chatInput.trim()}
                title="Enviar"
              >
                <span>📤</span>
              </button>
            </div>
            <div className={styles.inputHint}>
              💡 Tip: Usa palabras clave como "partidos", "clasificacion",
              "goleadores"
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
