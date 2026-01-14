# UI/UX & Debugging Agents - Workflows

Este directorio contiene workflows organizados en "Swarms" (Enjambres) para Desarrollo y Debugging.

## 🧠 Swarm 1: UI/UX (Diseño y Frontend)

### 👑 `/ui-orchestrator`
**Rol**: Product Manager & Design Lead.
**Uso**: Para crear nuevas features o refactorizaciones visuales completas.
**Coordina a**:
- `/ui-reviewer` (Diseño/Specs/QA)
- `/ui-implementer` (Frontend Dev)

---

## 🚑 Swarm 2: Debugging & Reparación

### 👑 `/bug-fixer`
**Rol**: Jefe de Triage y Orquestador de Bugs.
**Uso**: Para cualquier error o bug reportado.
**Función**: Diagnostica y delega.

### 🛠️ `/backend-debugger`
**Rol**: Especialista Backend & Supabase DBA.
**Poderes MCP**:
- Acceso a Logs de Supabase.
- Ejecución de SQL.
- Inspección de RLS.
**Uso**: Invocado por `bug-fixer` para errores 500, problemas de datos o auth.

---

## 🛡️ Agentes de Soporte (Transversales)

### `/code-reviewer`
**Rol**: QA Técnico.
**Uso**: Verifica calidad de código, naming conventions y TypeScript.

### `/git-commit`
**Rol**: Release Manager.
**Uso**: Empaqueta cambios y gestiona versionamiento.

---

## Ejemplo de Flujo Completo (Error Complejo)

1. Usuario: "No puedo guardar mi diagrama, sale error".
2. Ejecutas: `/bug-fixer`.
3. **Bug Fixer**: Analiza y sospecha del backend. Llama a `backend-debugger`.
4. **Backend Debugger**: Usa MCP, ve logs, detecta error RLS en Supabase. Propone fix SQL.
5. **Bug Fixer**: Aplica el fix SQL. Pide a usuario probar.
6. Usuario: "Ya guarda, pero se ve feo el mensaje de éxito".
7. **Bug Fixer**: Llama a `ui-orchestrator`.
8. **UI Swarm**: Diseña e implementa un Toast de éxito estilo Apple.
