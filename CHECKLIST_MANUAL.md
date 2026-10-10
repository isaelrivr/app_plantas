# Checklist de verificación manual en dispositivo

Probar en una development build Android y otra iOS. Marcar cada resultado con fecha y versión.

1. Instalar, abrir por primera vez y completar las 3 páginas de onboarding. Cerrar y abrir: no debe volver a aparecer.
2. Denegar cámara. El escáner debe mostrar un mensaje claro y permitir reintentar o elegir galería.
3. Conceder cámara, tomar una foto, añadir una segunda y ejecutar identificación por lote. Confirmar candidatos, guardar en jardín y volver a abrir la ficha.
4. Repetir cuatro identificaciones en plan Free. La cuarta debe mostrar el límite y abrir Paywall sin bloquear la app.
5. Cambiar la fecha del dispositivo al día siguiente o esperar el cambio real. Confirmar que el contador diario se reinicia.
6. En Mi Jardín, regar una planta, moverla entre habitaciones, crear una zona y eliminarla. Cerrar y abrir: los cambios deben sobrevivir.
7. Abrir clima con GPS permitido, denegado y sin conexión. Debe mostrar datos o fallback claro sin quedarse cargando.
8. Abrir ficha botánica, cambiar todas las pestañas, ver toxicidad y mapa. En Free el gating debe llevar a Paywall.
9. Diagnóstico: probar cámara, galería, permiso denegado y muestra inválida. Confirmar estados de carga, error y resultado.
10. Calendario: completar, eliminar y programar una tarea. Verificar que la notificación llega; denegar permisos y confirmar mensaje de ajustes.
11. Diario: agregar foto, guardar medidas, abrir comparador, borrar entrada y comprobar que la foto deja de ocupar el almacenamiento de la app.
12. Asistente: enviar texto, tocar respuesta rápida, probar sin red y verificar fallback local o error amigable.
13. Enciclopedia: combinar búsqueda, luz, dificultad, ambiente y mascotas; activar “Mis plantas”; comprobar lista vacía y lista larga.
14. Logros: regar, completar tareas, identificar y diagnosticar. Confirmar progreso y que se conserva tras reiniciar.
15. Ajustes: tema sistema/claro/oscuro, idioma español/inglés, notificaciones, reintroducción y borrado local. Tras borrar, no deben quedar plantas, fotos, diario, estadísticas ni Pro local.
16. Activar modo avión durante cada flujo de red. Ninguna pantalla debe quedarse bloqueada indefinidamente.
17. Llenar almacenamiento o revocar acceso a fotos y repetir guardado. Debe aparecer error recuperable, sin cierre de la app.
18. Probar teclado, rotación (si se habilita en el build), fuente grande y lector de pantalla en controles principales.
