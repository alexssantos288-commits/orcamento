import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
async function requireUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error(error?.message || 'No user logged in');
  }
  return user.id;
}

async function verifyOwnership(table, recordId) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from(table)
    .select('user_id')
    .eq('id', recordId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.user_id !== userId) {
    throw new Error('Record not found or access denied');
  }
}

function validateData(data) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error('Invalid or empty data provided');
  }
}

// Generic CRUD helpers
async function getRecords(table) {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function addRecord(table, data) {
  try {
    validateData(data);
    const userId = await requireUserId();
    const recordData = { ...data, user_id: userId };
    const { data: newRecord, error } = await supabase
      .from(table)
      .insert([recordData])
      .select()
      .single();
    if (error) throw error;
    return { data: newRecord, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function updateRecord(table, id, data) {
  try {
    await verifyOwnership(table, id);
    validateData(data);
    const { data: updated, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function deleteRecord(table, id) {
  try {
    await verifyOwnership(table, id);
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { data: { deleted: true }, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Auth functions
async function loginUser(email, password) {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function registerUser(email, password, nome) {
  try {
    if (!email || !password || !nome?.trim()) {
      throw new Error('Email, password, and nome are required');
    }
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
    if (data.user) {
      const { error: updateError } = await supabase.auth.updateUser({ data: { nome: nome.trim() } });
      if (updateError) {
        console.error('Failed to update user metadata:', updateError.message);
      }
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    return {
      data: data?.user || null,
      error: error ? error.message : null
    };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { data: { loggedOut: true }, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Specific CRUD functions

const getClientes = () => getRecords('clientes');
const addCliente = (data) => addRecord('clientes', data);
const updateCliente = (id, data) => updateRecord('clientes', id, data);
const deleteCliente = (id) => deleteRecord('clientes', id);

const getOrcamentos = () => getRecords('orcamentos');
const addOrcamento = (data) => addRecord('orcamentos', data);
const updateOrcamento = (id, data) => updateRecord('orcamentos', id, data);
const deleteOrcamento = (id) => deleteRecord('orcamentos', id);

const getContratos = () => getRecords('contratos');
const addContrato = (data) => addRecord('contratos', data);
const updateContrato = (id, data) => updateRecord('contratos', id, data);
const deleteContrato = (id) => deleteRecord('contratos', id);

// Exports
export { supabase, loginUser, registerUser, getCurrentUser, logoutUser, getClientes, addCliente, updateCliente, deleteCliente, getOrcamentos, addOrcamento, updateOrcamento, deleteOrcamento, getContratos, addContrato, updateContrato, deleteContrato };
export default supabase;