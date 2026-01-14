---
description: Orquestador del flujo de lanzamiento (Docs -> Git -> Deploy -> Obsidian)
---

# Release Flow Orchestrator

Este workflow coordina a los agentes especialistas (`doc-update`, `git-commit`, `deploy-prod`, `obsidian-log`) para ejecutar un ciclo de lanzamiento completo.

## Pasos del Workflow

### 1. 📚 Fase de Documentación
**Ejecuta**: `/doc-update`
**Objetivo**: Asegurar que la documentación esté lista antes de cerrar la versión.

### 2. 🛡️ Fase de Control de Versiones
**Ejecuta**: `/git-commit`
**Objetivo**: Crear un commit semántico y hacer push al remoto.

---
**⏸️ PUNTO DE CONTROL**
Pregunta al usuario si desea continuar con el despliegue a producción.
---

### 3. 🚀 Fase de Despliegue
**Ejecuta**: `/deploy-prod`
**Objetivo**: Verificar build y confirmar despliegue.

### 4. 📝 Fase de Registro
**Ejecuta**: `/obsidian-log`
**Objetivo**: Guardar un registro permanente de este lanzamiento en Obsidian.

## Instrucciones para el Agente Principal
Cuando ejecutes este workflow:
1. Llama a cada sub-agente (leyendo su archivo .md y siguiendo sus instrucciones).
2. Mantén el contexto entre agentes (pasa el mensaje de commit al agente de Obsidian, etc.).
3. Si un paso falla, DETÉN el proceso y pide ayuda al usuario.
