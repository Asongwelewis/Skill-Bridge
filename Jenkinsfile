pipeline {
    agent any

    environment {
        DOCKERHUB_USER    = 'nahnahsylvestre'
        DOCKERHUB_CREDS   = credentials('dockerhub-credentials')
        KUBECONFIG_CREDS  = credentials('kubeconfig')
        SUPABASE_URL      = 'https://tulwescncreiuclmfafv.supabase.co'
        SERVICES          = 'user-service matching-service session-service quiz-service notification-service'
    }

    stages {

        // ── Stage 1: Checkout ──────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out from GitHub"
            }
        }

        // ── Stage 2: Install & Test all services ──────────
        stage('Test') {
            parallel {
                stage('Test user-service') {
                    steps {
                        dir('Services/user-service') {
                            sh 'rm -rf node_modules'
                            sh 'npm ci'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Test matching-service') {
                    steps {
                        dir('Services/matching-service') {
                            sh 'rm -rf node_modules'
                            sh 'npm ci'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Test session-service') {
                    steps {
                        dir('Services/session-service') {
                            sh 'rm -rf node_modules'
                            sh 'npm ci'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Test quiz-service') {
                    steps {
                        dir('Services/quiz-service') {
                            sh 'rm -rf node_modules'
                            sh 'npm ci'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Test notification-service') {
                    steps {
                        dir('Services/notification-service') {
                            sh 'rm -rf node_modules'
                            sh 'npm ci'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
            }
        }

        // ── Stage 3: Build Docker images ──────────────────
        stage('Build') {
            steps {
                script {
                    // Build microservices
                    def services = ['user-service', 'matching-service', 'session-service', 'quiz-service', 'notification-service']
                    for (svc in services) {
                        echo "Building ${svc}..."
                        sh """
                            docker build \
                                -t ${DOCKERHUB_USER}/skillbridge-${svc}:${BUILD_NUMBER} \
                                -t ${DOCKERHUB_USER}/skillbridge-${svc}:latest \
                                Services/${svc}
                        """
                    }

                    // Build frontend
                    echo "Building frontend..."
                    sh """
                        docker build \
                            --build-arg VITE_SUPABASE_URL=https://tulwescncreiuclmfafv.supabase.co \
                            --build-arg VITE_SUPABASE_ANON_KEY=sb_publishable_4bZC7aRz9WynNik-2yqibg_DfKrBi0i \
                            --build-arg VITE_API_URL=http://skillbridge-sen3244.duckdns.org \
                            -t ${DOCKERHUB_USER}/skillbridge-frontend:${BUILD_NUMBER} \
                            -t ${DOCKERHUB_USER}/skillbridge-frontend:latest \
                            frontend
                    """
                }
            }
        }

        // ── Stage 4: Push to Docker Hub ───────────────────
        stage('Push') {
            steps {
                script {
                    sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"

                    // Push microservices
                    def services = ['user-service', 'matching-service', 'session-service', 'quiz-service', 'notification-service']
                    for (svc in services) {
                        echo "Pushing ${svc}..."
                        sh "docker push ${DOCKERHUB_USER}/skillbridge-${svc}:${BUILD_NUMBER}"
                        sh "docker push ${DOCKERHUB_USER}/skillbridge-${svc}:latest"
                    }

                    // Push frontend
                    echo "Pushing frontend..."
                    sh "docker push ${DOCKERHUB_USER}/skillbridge-frontend:${BUILD_NUMBER}"
                    sh "docker push ${DOCKERHUB_USER}/skillbridge-frontend:latest"
                }
            }
        }

        // ── Stage 5: Deploy to Kubernetes ─────────────────
        stage('Deploy') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {

                        // Deploy microservices
                        def services = ['user-service', 'matching-service', 'session-service', 'quiz-service', 'notification-service']
                        for (svc in services) {
                            echo "Deploying ${svc} to K8s..."
                            sh """
                                kubectl set image deployment/${svc} \
                                    ${svc}=${DOCKERHUB_USER}/skillbridge-${svc}:${BUILD_NUMBER} \
                                    --record || \
                                kubectl apply -f k8s/${svc}.yaml
                            """
                        }

                        // Deploy frontend
                        echo "Deploying frontend to K8s..."
                        sh """
                            kubectl set image deployment/frontend-service \
                                frontend=${DOCKERHUB_USER}/skillbridge-frontend:${BUILD_NUMBER} \
                                --record || \
                            kubectl apply -f k8s/frontend-service.yaml
                        """

                        // Verify all rollouts
                        for (svc in services) {
                            sh "kubectl rollout status deployment/${svc} --timeout=300s"
                        }
                        sh "kubectl rollout status deployment/frontend-service --timeout=300s"
                    }
                }
            }
        }
    }

    // ── Post actions ──────────────────────────────────────
    post {
        success {
            echo '🎉 Pipeline completed successfully! All services and frontend deployed.'
        }
        failure {
            echo '❌ Pipeline failed. Check logs above.'
        }
        always {
            sh 'docker system prune -f || true'
        }
    }
}