#!/bin/bash
variables=("$@")

if [ -z "$APP_ENV" ]; then
    echo "Warning: APP_ENV is not set"
    exit 1
fi

echo "app env: $APP_ENV"

# Determina o prefixo baseado no APP_ENV
env_prefix=""
if [ "$APP_ENV" == "production" ]; then
env_prefix="PROD"
else
env_prefix="DEV"
fi

for varName in "${variables[@]}"; do
# Cria o nome da variável original e da nova variável
original_var="MEDQ_${env_prefix}_${varName#MEDQ_}"

# Verifica se a variável original está definida
if [ -z "${!original_var}" ]; then
    echo "Warning: $original_var is not set"
    exit 2
else
    export "$varName"="${!original_var}"
fi
done

# Clean local variables
unset env_prefix
unset original_var
unset variables
unset varName