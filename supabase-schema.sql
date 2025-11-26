-- ============================================
-- FOOTBALL DATA BROWSER - SUPABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    token_balance INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queries history table
CREATE TABLE public.queries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    query_text TEXT NOT NULL,
    intent TEXT NOT NULL,
    entities JSONB,
    response_data JSONB,
    tokens_consumed INTEGER NOT NULL DEFAULT 5,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token transactions table
CREATE TABLE public.token_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('allocation', 'consumption', 'refund')),
    description TEXT,
    admin_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (ChatGPT-style chats)
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Nueva conversación',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (messages within conversations)
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    query_id UUID REFERENCES public.queries(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_queries_user_id ON public.queries(user_id);
CREATE INDEX idx_queries_created_at ON public.queries(created_at DESC);
CREATE INDEX idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at ASC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Queries policies
CREATE POLICY "Users can view own queries" ON public.queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queries" ON public.queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all queries" ON public.queries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Token transactions policies
CREATE POLICY "Users can view own transactions" ON public.token_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.token_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert transactions" ON public.token_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation updated_at when message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when message is added
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, token_balance)
    VALUES (NEW.id, NEW.email, 'user', 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to consume tokens
CREATE OR REPLACE FUNCTION public.consume_tokens(
    p_user_id UUID,
    p_tokens INTEGER,
    p_query_text TEXT,
    p_intent TEXT,
    p_entities JSONB,
    p_response_data JSONB,
    p_response_time_ms INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_query_id UUID;
BEGIN
    -- Get current token balance
    SELECT token_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id;

    -- Check if user has enough tokens
    IF v_current_balance < p_tokens THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient tokens',
            'current_balance', v_current_balance,
            'required', p_tokens
        );
    END IF;

    -- Deduct tokens
    UPDATE public.profiles
    SET token_balance = token_balance - p_tokens
    WHERE id = p_user_id;

    -- Create query record
    INSERT INTO public.queries (
        user_id,
        query_text,
        intent,
        entities,
        response_data,
        tokens_consumed,
        response_time_ms
    ) VALUES (
        p_user_id,
        p_query_text,
        p_intent,
        p_entities,
        p_response_data,
        p_tokens,
        p_response_time_ms
    ) RETURNING id INTO v_query_id;

    -- Create transaction record
    INSERT INTO public.token_transactions (
        user_id,
        amount,
        transaction_type,
        description
    ) VALUES (
        p_user_id,
        -p_tokens,
        'consumption',
        'Query: ' || p_query_text
    );

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'query_id', v_query_id,
        'tokens_consumed', p_tokens,
        'new_balance', v_current_balance - p_tokens
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to allocate tokens (admin only)
CREATE OR REPLACE FUNCTION public.allocate_tokens(
    p_user_id UUID,
    p_amount INTEGER,
    p_admin_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_new_balance INTEGER;
BEGIN
    -- Check if caller is admin
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles
    WHERE id = p_admin_id;

    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;

    -- Add tokens to user
    UPDATE public.profiles
    SET token_balance = token_balance + p_amount
    WHERE id = p_user_id
    RETURNING token_balance INTO v_new_balance;

    -- Create transaction record
    INSERT INTO public.token_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        admin_id
    ) VALUES (
        p_user_id,
        p_amount,
        'allocation',
        COALESCE(p_description, 'Token allocation by admin'),
        p_admin_id
    );

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'amount_allocated', p_amount,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL DATA (OPTIONAL)
-- ============================================

-- Create an admin user (you'll need to update the UUID after creating the user in Supabase Auth)
-- UNCOMMENT AND UPDATE THE UUID AFTER CREATING YOUR ADMIN USER:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
