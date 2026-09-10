export type TaskRow = {
  id: string;
  title: string;
  branch_name: string | null;
  details: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  serial: number | null;
  created_at: string;
  completed_at: string | null;
};

export type TaskEventRow = {
  id: number;
  task_id: string | null;
  actor: "USER" | "MCP";
  action: "CREATED" | "UPDATED" | "COMPLETED" | "REOPENED" | "DELETED";
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: {
          id?: string;
          title: string;
          branch_name?: string | null;
          details?: string | null;
          status?: TaskRow["status"];
          serial?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          branch_name?: string | null;
          details?: string | null;
          status?: TaskRow["status"];
          serial?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      task_events: {
        Row: TaskEventRow;
        Insert: {
          id?: number;
          task_id?: string | null;
          actor: TaskEventRow["actor"];
          action: TaskEventRow["action"];
          created_at?: string;
        };
        Update: {
          id?: number;
          task_id?: string | null;
          actor?: TaskEventRow["actor"];
          action?: TaskEventRow["action"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      task_status: "TODO" | "IN_PROGRESS" | "COMPLETED";
      event_actor: "USER" | "MCP";
      event_action: "CREATED" | "UPDATED" | "COMPLETED" | "REOPENED" | "DELETED";
    };
    CompositeTypes: Record<string, never>;
  };
}
