pipeline {
    agent {
        dockerfile {
            filename 'Dockerfile'
			dir 'Sources/gneis' // TODO: Cambiar para que sea igual que el REPO_PATH
			args '-u 9001:990 --privileged -v /var/run/docker.sock:/var/run/docker.sock  -v /home/isdefeG/.ssh:/home/jenkins/.ssh'
        }
    }
    parameters { 
        booleanParam(defaultValue: true, description: '¿Desea desplegar en DESARROLLO?', name: 'checkDes')
        booleanParam(defaultValue: false, description: '¿Desea desplegar en CERTIFICACIÓN?', name: 'checkCert')
        booleanParam(defaultValue: false, description: '¿Desea desplegar en PRODUCCIÓN?', name: 'checkProd')
        booleanParam(defaultValue: true, description: '¿Desea compilar?', name: 'checkCom')
        string(defaultValue: 'latest', description: 'Introducir versión de despliegue', name: 'versionProyecto')         
        string(defaultValue: 'master', description: 'Rama de Git a clonar', name: 'branchProyecto')         
    }
    environment {
        TOKENadministradorCNIG = credentials("TOKENadministradorCNIG")
        TOKENIDEESpain = credentials("TOKENIDEESpain")
        USERadministradorCNIG = credentials("USERadministradorCNIG")
        AWS_ACCESS_KEY_ID = credentials("AWS_ACCESS_KEY_ID")
        AWS_SECRET_ACCESS_KEY = credentials("AWS_SECRET_ACCESS_KEY")

		// TODO: Cambiar estas variables de entorno por las que correspondan a tu proyecto
        REPO_URL = 'https://github.com/VisualizadoresCartograficos/Vis.gneis.git'
        REPO_PATH = 'Sources/gneis'
		IMAGE_BASENAME = "vis-gneis"
        PORT = 9045
        CLOUDFRONT_ROUTES = "/gneis*"
        DISTRIBUTION_ID = "E238HBJQL76X5K"
        email_to = 'proyectos@cnig.es, G_servicio_cnig@syvalue.com, eduardo.martin@cnig.es, laura.gm@cnig.es, yaiza.gomez@cnig.es'
    }
    stages {
        stage('1. Clonar repositorio') {
            when {
                expression { return params.checkCom }
            }
            steps {
                echo "Clonando repositorio (rama: ${params.branchProyecto})..."
                git branch: "${params.branchProyecto}", credentialsId: 'NewGithubTemp', url: "${REPO_URL}"
                echo "Repo cloned to: ${env.WORKSPACE}"
            }
        }
        
        stage('2. Crear y subir todas las imágenes') {
            when {
                expression { return params.checkCom }
            }
            steps {
                echo "Construyendo y subiendo imágenes para todos los entornos..."
                sh """
                    #!/bin/bash
                    set -e

                    echo "📁 Entrando al directorio del proyecto..."
                    cd ${REPO_PATH}

                    # --- DESARROLLO ---
                    echo "⚙️ [1/3] Construyendo imagen de DESARROLLO..."
                    docker buildx build \
                    --load \
                    --no-cache \
                    --build-arg NEXT_PUBLIC_API_IDEE_URL=https://componentes-desarrollo.idee.es/api-idee \
                    --build-arg NEXT_PUBLIC_API_IDEE_PLUGINS_URL=https://componentes-desarrollo.idee.es/api-idee \
                    --build-arg NEXT_PUBLIC_GNEIS_PORTAL_URL=http://10.67.33.172:8180 \
                    --build-arg NEXT_PUBLIC_GNEIS_STAC_URL=http://10.67.33.163:8082 \
                    --build-arg NEXT_PUBLIC_GNEIS_DOWNLOAD_URL=https://stac-gneis.idee.es/download-service/v1/download-jobs \
                    --build-arg NEXT_PUBLIC_ASSET_VERSION=1 \
                    --build-arg PAGE_TITLE=Visualizador GNEIS \
                    -t ${IMAGE_BASENAME}_des:${versionProyecto} .

                    echo "🔁 Etiquetando y subiendo desarrollo..."
                    docker tag ${IMAGE_BASENAME}_des:${versionProyecto} 10.67.33.46:5000/${IMAGE_BASENAME}_des:${versionProyecto}
                    docker tag ${IMAGE_BASENAME}_des:${versionProyecto} 10.67.33.46:5000/${IMAGE_BASENAME}_des:latest
                    docker push 10.67.33.46:5000/${IMAGE_BASENAME}_des:${versionProyecto}
                    docker push 10.67.33.46:5000/${IMAGE_BASENAME}_des:latest

                    # --- CERTIFICACIÓN ---
                    echo "⚙️ [2/3] Construyendo imagen de CERTIFICACIÓN..."
                    docker buildx build \
                    --load \
                    --no-cache \
                    --build-arg NEXT_PUBLIC_API_IDEE_URL=http://192.168.193.46:9010/api-idee \
                    --build-arg NEXT_PUBLIC_API_IDEE_PLUGINS_URL=http://192.168.193.46:9010/api-idee \
                    --build-arg NEXT_PUBLIC_GNEIS_PORTAL_URL=http://192.168.193.167:8180 \
                    --build-arg NEXT_PUBLIC_GNEIS_STAC_URL=https://stac-gneis.idee.es/stac \
                    --build-arg NEXT_PUBLIC_GNEIS_DOWNLOAD_URL=https://stac-gneis.idee.es/download-service/v1/download-jobs \
                    --build-arg NEXT_PUBLIC_ASSET_VERSION=1 \
                    --build-arg PAGE_TITLE=Visualizador GNEIS \
                    -t ${IMAGE_BASENAME}_cer:${versionProyecto} .

                    echo "🔁 Etiquetando y subiendo certificación..."
                    docker tag ${IMAGE_BASENAME}_cer:${versionProyecto} 10.67.33.46:5000/${IMAGE_BASENAME}_cer:${versionProyecto}
                    docker tag ${IMAGE_BASENAME}_cer:${versionProyecto} 10.67.33.46:5000/${IMAGE_BASENAME}_cer:latest
                    docker push 10.67.33.46:5000/${IMAGE_BASENAME}_cer:${versionProyecto}
                    docker push 10.67.33.46:5000/${IMAGE_BASENAME}_cer:latest

                    # --- PRODUCCIÓN ---
                    echo "⚙️ [3/3] Construyendo imagen de PRODUCCIÓN..."
                    docker buildx build \
                    --load \
                    --no-cache \
                    --build-arg NEXT_PUBLIC_API_IDEE_URL=https://componentes.idee.es/api-idee \
                    --build-arg NEXT_PUBLIC_API_IDEE_PLUGINS_URL=https://componentes.idee.es/api-idee \
                    --build-arg NEXT_PUBLIC_GNEIS_PORTAL_URL=https://gneis.cnig.es \
                    --build-arg NEXT_PUBLIC_GNEIS_STAC_URL=https://stac-gneis.idee.es/stac \
                    --build-arg NEXT_PUBLIC_GNEIS_DOWNLOAD_URL=https://stac-gneis.idee.es/download-service/v1/download-jobs \
                    --build-arg NEXT_PUBLIC_ASSET_VERSION=1 \
                    --build-arg PAGE_TITLE=Visualizador GNEIS \
                    -t ${IMAGE_BASENAME}_prod:${versionProyecto} .

                    echo "🔁 Etiquetando y subiendo producción..."
                    docker tag ${IMAGE_BASENAME}_prod:${versionProyecto} 10.67.33.46:5000/${IMAGE_BASENAME}_prod:${versionProyecto}
                    docker tag ${IMAGE_BASENAME}_prod:${versionProyecto} 10.67.33.46:5000/${IMAGE_BASENAME}_prod:latest
                    docker push 10.67.33.46:5000/${IMAGE_BASENAME}_prod:${versionProyecto}
                    docker push 10.67.33.46:5000/${IMAGE_BASENAME}_prod:latest
                """
            }
        }
    
        stage('3. Despliegue Desarrollo') {
            when {
                expression { return params.checkDes }
            }
            environment {
                CONTAINER_NAME = "${IMAGE_BASENAME}_des"
                VERSION_TAG = "10.67.33.46:5000/${IMAGE_BASENAME}_des:${versionProyecto}"
                LATEST_TAG = "10.67.33.46:5000/${IMAGE_BASENAME}_des:latest"
            }
            steps {
                echo "Desplegando en desarrollo con docker stack...."
                sh """
                    ssh -o StrictHostKeyChecking=no root@10.67.33.46 "docker pull ${VERSION_TAG}"
                    ssh -o StrictHostKeyChecking=no root@10.67.33.46 'if lsof -i :${PORT} >/dev/null 2>&1; then docker ps --filter "publish=${PORT}" -q | xargs --no-run-if-empty docker rm -f; else echo "Puerto ${PORT} libre, no hay contenedores que eliminar."; fi'
                    ssh -o StrictHostKeyChecking=no root@10.67.33.46 "docker rm -f ${CONTAINER_NAME}"
                    
                    ssh -o StrictHostKeyChecking=no root@10.67.33.46 /bin/bash -c \"
                        cd /docker/idee_visualizadores &&
                        cat > ${IMAGE_BASENAME}.yml <<EOF
version: '3'
services:
  ${IMAGE_BASENAME}:
    image: ${VERSION_TAG}
    ports:
      - \\\"${PORT}:3000\\\"
    deploy:
      restart_policy:
        condition: any
EOF
                        docker swarm init 2>/dev/null || true
                        docker stack deploy -c ${IMAGE_BASENAME}.yml ${IMAGE_BASENAME}_stack
                    \"
                """
            }
        }
    
        stage('3. Despliegue Certificacion') {
            when {
                expression { return params.checkCert }
            }
            environment {
                CONTAINER_NAME = "${IMAGE_BASENAME}_cer"
                VERSION_TAG = "10.67.33.46:5000/${IMAGE_BASENAME}_cer:${versionProyecto}"
                LATEST_TAG = "10.67.33.46:5000/${IMAGE_BASENAME}_cer:latest"
            }
            steps {
                echo "Desplegando en certificación...."
                sh """
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.193.46 "docker pull ${VERSION_TAG}"
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.193.46 "if netstat -tuln | grep -q ':${PORT} '; then docker ps --filter \\\"publish=${PORT}\\\" -q | xargs --no-run-if-empty docker rm -f; else echo \\\"Puerto ${PORT} libre, no hay contenedores que eliminar.\\\"; fi"
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.193.46 "docker rm -f ${CONTAINER_NAME}"
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.193.46 /bin/bash -c \"
                        cd /docker/idee_visualizadores &&
                        cat > ${IMAGE_BASENAME}.yml <<EOF
version: '3'
services:
  ${IMAGE_BASENAME}:
    image: ${VERSION_TAG}
    ports:
      - \\\"${PORT}:3000\\\"
    deploy:
      restart_policy:
        condition: any
EOF
                        docker swarm init 2>/dev/null || true
                        docker stack deploy -c ${IMAGE_BASENAME}.yml ${IMAGE_BASENAME}_stack
                    \"
                """

                emailext(
                    attachLog: true, 
                    body: "Desplegado ${env.JOB_NAME} en CERTIFICACIÓN - Build # ${env.BUILD_NUMBER}\n${env.BUILD_STATUS}: Check console output at ${env.BUILD_URL} to view the results.", 
                    recipientProviders: [buildUser()], 
                    subject: "${env.JOB_NAME} CERTIFICACIÓN - Build # ${env.BUILD_NUMBER} - ${env.BUILD_STATUS}", 
                    to: "${email_to}"
                )
            }
        }
    
        stage('3. Despliegue Producción') {
            when {
                expression { return params.checkProd }
            }
            environment {
                CONTAINER_NAME = "${IMAGE_BASENAME}_prod"
                VERSION_TAG = "10.67.33.46:5000/${IMAGE_BASENAME}_prod:${versionProyecto}"
                LATEST_TAG = "10.67.33.46:5000/${IMAGE_BASENAME}_prod:latest"
            }
            steps {
                echo "Desplegando en producción...."
                sh """
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.192.42 "docker pull ${VERSION_TAG}"
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.192.42 'if lsof -i :${PORT} >/dev/null 2>&1; then docker ps --filter "publish=${PORT}" -q | xargs --no-run-if-empty docker rm -f; else echo "Puerto ${PORT} libre, no hay contenedores que eliminar."; fi'
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.192.42 "docker rm -f ${CONTAINER_NAME}"
                    ssh -o StrictHostKeyChecking=no isdefeG@192.168.192.42 /bin/bash -c \"
                        cd /docker/idee_visualizadores &&
                        cat > ${IMAGE_BASENAME}.yml <<EOF
version: '3'
services:
  ${IMAGE_BASENAME}:
    image: ${VERSION_TAG}
    ports:
      - \\\"${PORT}:3000\\\"
    deploy:
      restart_policy:
        condition: any
EOF
                        docker swarm init 2>/dev/null || true
                        docker stack deploy -c ${IMAGE_BASENAME}.yml ${IMAGE_BASENAME}_stack
                    \"
                """
                
                emailext(
                    attachLog: true, 
                    body: "Desplegado ${env.JOB_NAME} en PRODUCCIÓN - Build # ${env.BUILD_NUMBER}\n${env.BUILD_STATUS}: Check console output at ${env.BUILD_URL} to view the results.", 
                    recipientProviders: [buildUser()], 
                    subject: "${env.JOB_NAME} PRODUCCIÓN - Build # ${env.BUILD_NUMBER} - ${env.BUILD_STATUS}", 
                    to: "${email_to}"
                )
            }
        }

        stage('Invalidate CloudFront Cache') {
            when {
                expression { return params.checkProd }
            }
            steps {
                script {
                    sh """
                        aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                        aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                        aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths $CLOUDFRONT_ROUTES
                    """
                }
            }
        }
    
        stage('Limpiamos entorno de trabajo') {
            steps {
                sh "ls -l"
                sh "docker system prune -af"
            }
        }
    }
}