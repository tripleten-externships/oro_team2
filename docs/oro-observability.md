# ORO Observability MVP

La capa de observabilidad registra interacciones anónimas para que el equipo ORO entienda el recorrido de producto sin alterar los cálculos, la experiencia pública ni la comparación de opciones.

![Diagrama de arquitectura ORO Observability](images/oro-observability-architecture.svg)

## Qué mide

El tracker del navegador es opcional y no bloquea la interfaz. Cuando está habilitado, registra eventos acotados: inicio de recorrido, pasos completados, resultados, detalle y selección de producto, comparación y reinicio. Las propiedades son enums controlados; no transmite valores de vivienda, saldo, tasa, necesidad de efectivo, edad, respuestas, nombres, emails ni texto libre.

CloudFront aporta la IP y la geografía de confianza. Se guarda el país para todos los visitantes y el código de estado únicamente cuando el país es `US`; para el resto, la región se normaliza a `XX`. La IP se conserva solo en DynamoDB para el periodo de retención de 30 días y nunca se incluye en la interfaz, los logs, ni las exportaciones.

## Arquitectura y seguridad

CloudFront con WAF es la única entrada pública. Conserva la app homeowner en Amplify, sirve el bundle admin desde S3 privado y enruta las dos APIs a Lambda Function URLs protegidas mediante Origin Access Control y SigV4. No hay API Gateway, VPC, ALB, NAT ni servicios de procesamiento adicionales.

La Lambda de ingesta valida tamaño, esquema, UUID, eventos y propiedades permitidas antes de escribir en DynamoDB. La tabla está cifrada, usa TTL de 30 días, PITR y un índice por día con cuatro shards. La Lambda admin consulta solo ese índice, devuelve métricas acotadas y genera CSV temporal en un bucket privado con expiración de 24 horas.

El homeowner y la comparación continúan completamente públicos. Solo `/oro-admin` usa Cognito Hosted UI con Authorization Code + PKCE. El cliente SPA no tiene secreto; el acceso a métricas y exportaciones exige un access token válido con el grupo `oro-admin`.

## Operación

El workflow manual **ORO Observability Deploy** usa GitHub Actions OIDC y el environment protegido `oro-production`; no usa access keys. Con `OBSERVABILITY_TRACKING_ENABLED=true`, construye el bundle público con tracking, publica el admin privado y actualiza exclusivamente el stack y distribución `oro-*`.

El dashboard muestra sesiones únicas, finalización guiada, exploración de producto, dispositivo y ubicaciones. El CSV contiene solo fecha de recepción, evento, país, estado US cuando exista, dispositivo, propiedades permitidas y un seudónimo efímero de sesión.
