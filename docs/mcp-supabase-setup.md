# Supabase MCP Setup Guide

## Overview
This document describes how to set up and use the Supabase Model Context Protocol (MCP) server for the Prom8eus project.

## Configuration

### 1. MCP Configuration File
The MCP server is configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "bash",
      "args": [
        "-lc",
        "npx -y @supabase/mcp-server-supabase@latest --access-token \"$SUPABASE_ACCESS_TOKEN\" --project-ref gasqdnyyrxmmojivlxon"
      ]
    }
  }
}
```

### 2. Configuration Parameters
- **access-token**: Supabase personal access token provided via environment variable `SUPABASE_ACCESS_TOKEN`
- **project-ref**: Specific Supabase project ID (`gasqdnyyrxmmojivlxon`)
- **command**: Uses npx to run the latest version of the MCP server

## Usage

### Starting the MCP Server
Start the MCP server by providing the token via environment variable:
```bash
export SUPABASE_ACCESS_TOKEN="<your-supabase-platform-token>"
npx @supabase/mcp-server-supabase@latest --access-token "$SUPABASE_ACCESS_TOKEN" --project-ref gasqdnyyrxmmojivlxon
```

### Available MCP Tools
Once properly configured and Cursor is restarted, the following MCP tools should be available:
- `mcp_supabase_list_projects` - List Supabase projects
- `mcp_supabase_list_tables` - List tables in the database
- `mcp_supabase_execute_sql` - Execute SQL queries
- `mcp_supabase_apply_migration` - Apply database migrations
- And more...

## Database Schema

### Workflow Cache Table
The MCP setup includes a `workflow_cache` table for storing cached n8n workflow data:

```sql
CREATE TABLE public.workflow_cache (
  version TEXT NOT NULL PRIMARY KEY,
  workflows JSONB NOT NULL,
  stats JSONB,
  last_fetch_time TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Troubleshooting

### MCP Tools Not Available
If MCP tools are not available in Cursor:
1. Ensure the MCP server is running: `ps aux | grep mcp`
2. Restart Cursor IDE completely
3. Check the configuration file syntax
4. Verify the access token is valid

### Server Connection Issues
- Verify the project reference matches your Supabase project
- Check that the access token has appropriate permissions
- Ensure network connectivity to Supabase

## Security Notes
- Never hardcode tokens in repository files
- Keep access tokens secure and rotate them regularly
- Consider using read-only mode for production: add `--read-only` flag
- The project reference limits access to a specific project

## Future Enhancements
- Implement read-only mode for production use
- Add environment-specific configurations
- Set up token rotation procedures
- Add monitoring and logging for MCP operations


