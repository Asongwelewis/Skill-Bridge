pipeline {
    agent any

    environment {
        DOCKERHUB_USER    = 'nahnahsylvestre'
        DOCKERHUB_CREDS   = credentials('dockerhub-credentials')
        KUBECONFIG_CREDS  = credentials('kubeconfig')
        SUPABASE_URL      = 'https://tulwescncreiuclmfafv.supabase.co'
        SERVICES          = 'user-service matching-service session-service quiz-service'
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
    }
}

        // ── Stage 3: Build Docker images ──────────────────
        stage('Build') {
    steps {
        script {
            def services = ['user-service', 'matching-service', 'session-service', 'quiz-service']
            for (svc in services) {
                echo "Building ${svc}..."
                sh """
                    docker build \
                        -t ${DOCKERHUB_USER}/skillbridge-${svc}:${BUILD_NUMBER} \
                        -t ${DOCKERHUB_USER}/skillbridge-${svc}:latest \
                        Services/${svc}
                """
            }
        }
    }
}

        // ── Stage 4: Push to Docker Hub ───────────────────
        stage('Push') {
            steps {
                script {
                    sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
                    def services = ['user-service', 'matching-service', 'session-service', 'quiz-service']
                    for (svc in services) {
                        echo "Pushing ${svc}..."
                        sh "docker push ${DOCKERHUB_USER}/skillbridge-${svc}:${BUILD_NUMBER}"
                        sh "docker push ${DOCKERHUB_USER}/skillbridge-${svc}:latest"
                    }
                }
            }
        }

        // ── Stage 5: Deploy to Kubernetes ─────────────────
        stage('Deploy') {
            steps {
                script {
                    // Write kubeconfig from Jenkins credentials
                    withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                        def services = ['user-service', 'matching-service', 'session-service', 'quiz-service']
                        for (svc in services) {
                            echo "Deploying ${svc} to K8s..."
                            sh """
                                kubectl set image deployment/${svc} \
                                    ${svc}=${DOCKERHUB_USER}/skillbridge-${svc}:${BUILD_NUMBER} \
                                    --record || \
                                kubectl apply -f k8s/${svc}.yaml
                            """
                        }
                        // Verify rollout
                        for (svc in services) {
                            sh "kubectl rollout status deployment/${svc} --timeout=120s"
                        }
                    }
                }
            }
        }
    }

    // ── Post actions ──────────────────────────────────────
    post {
        success {
            echo '🎉 Pipeline completed successfully! All services deployed.'
        }
        failure {
            echo '❌ Pipeline failed. Check logs above.'
        }
        always {
            // Clean up docker images to save disk space
            sh 'docker system prune -f || true'
        }
    }
}