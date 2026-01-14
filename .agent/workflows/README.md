# UI/UX Agents - Workflows

Este directorio contiene workflows para mejorar la estética de la interfaz de usuario siguiendo los estándares de diseño de Apple.

## Agentes Disponibles

### `/ui-reviewer` - UI/UX Style Reviewer
**Propósito**: Analizar componentes y proponer mejoras estéticas basadas en Apple Aesthetic.

**Uso**:
```
/ui-reviewer
```

El agente te hará preguntas de contexto antes de revisar:
- ¿Deseas animaciones?
- ¿Estilo glass o sólido?
- ¿Vista desktop o mobile?

Luego generará un reporte detallado con:
- Diagnóstico de problemas actuales
- Recomendaciones específicas
- Plan de acción técnico para el implementador

### `/ui-implementer` - UI Style Implementer
**Propósito**: Ejecutar el plan de mejoras generado por el UI Reviewer.

**Uso**:
```
/ui-implementer
```

Requiere:
1. El plan de acción del UI Reviewer
2. El componente/archivo a modificar

Entrega:
- Código refactorizado
- Lista de cambios aplicados
- Notas técnicas si hubo desviaciones

## Workflow Completo

1. **Revisión**: Ejecuta `/ui-reviewer` con el componente a mejorar
2. **Aprobación**: Revisa el plan generado
3. **Implementación**: Ejecuta `/ui-implementer` con el plan aprobado
4. **Verificación**: Prueba los cambios en el navegador

## Estándares de Diseño

Los agentes siguen estos principios:
- **Tipografía**: Inter/SF Pro, pesos consistentes
- **Color**: Fondos puros, glassmorphism sutil
- **Sombras**: Difusas y suaves (`shadow-black/5`)
- **Bordes**: Redondeados (`rounded-xl`, `rounded-2xl`)
- **Motion**: Transiciones suaves con curvas naturales
- **Interacción**: Feedback visual en todos los estados

Ver `apple_aesthetic_agents.md` en artifacts para detalles completos.
