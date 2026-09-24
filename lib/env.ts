function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabasePublicEnv() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getAzureStorageEnv() {
  return {
    accountName: required("AZURE_STORAGE_ACCOUNT_NAME"),
    accountKey: required("AZURE_STORAGE_ACCOUNT_KEY"),
    containerName: required("AZURE_STORAGE_CONTAINER_NAME"),
  };
}
