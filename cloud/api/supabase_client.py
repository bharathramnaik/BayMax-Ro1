"""
Supabase Client Configuration
BayMax-Ro1 Database Connection
"""

import os
from typing import Optional

from supabase import create_client, Client


def get_supabase_client() -> Client:
    """
    Get Supabase client instance.
    
    Returns:
        Configured Supabase client
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
    
    return create_client(url, key)


def get_database_url() -> str:
    """
    Get PostgreSQL connection URL.
    
    Returns:
        Database connection string
    """
    # For serverless (Render), use transaction mode
    # For long-running processes, use direct connection
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        raise ValueError("DATABASE_URL must be set")
    
    return database_url


# Global client instance
_supabase_client: Optional[Client] = None


def get_client() -> Client:
    """
    Get or create Supabase client singleton.
    
    Returns:
        Supabase client instance
    """
    global _supabase_client
    
    if _supabase_client is None:
        _supabase_client = get_supabase_client()
    
    return _supabase_client
