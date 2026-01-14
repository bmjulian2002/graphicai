export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            flows: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    user_id: string
                    is_public: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    user_id: string
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    user_id?: string
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            flow_data: {
                Row: {
                    id: string
                    flow_id: string
                    nodes_data: Json
                    edges_data: Json
                    updated_at: string
                }
                Insert: {
                    id?: string
                    flow_id: string
                    nodes_data?: Json
                    edges_data?: Json
                    updated_at?: string
                }
                Update: {
                    id?: string
                    flow_id?: string
                    nodes_data?: Json
                    edges_data?: Json
                    updated_at?: string
                }
            }
        }
    }
}
