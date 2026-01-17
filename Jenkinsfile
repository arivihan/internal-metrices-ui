pipeline {
    agent {
        kubernetes {
            inheritFrom "java-17-builder"
            defaultContainer "builder"
        }
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'], description: 'Deployment Environment')
    }

    options {
        skipDefaultCheckout(true)
        timeout(time: 90, unit: 'MINUTES')
    }

    environment {
        GIT_REPO          = 'https://github.com/arivihan/internal-metrices-ui.git'
        GITHUB_TOKEN      = credentials('GitHubAccessToken')
        SONAR_TOKEN       = credentials('SonarQubeToken')

        AWS_REGION        = 'ap-south-1'
        ECR_REGISTRY      = '524814437057.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPO          = 'arivihan-internal-metrics-frontend'
        DOCKERFILE_PATH   = 'Dockerfile'

        SONARQUBE_ENV     = 'SonarQubeServer'
        SONAR_PROJECT_KEY = 'arivihan-internal-metrics-frontend'
    }

    stages {

        stage('Checkout SCM') {
            steps { 
                checkout scm 
              }
        }

        stage('Clone Arivihan Internal Metrics Frontend Application') {
            steps {
                dir('arivihan_internal_metrics_frontend_application') {
                     git branch: "${ARIVIHAN_INTERNAL_METRICS_FRONTEND_REPO_GIT_BRANCH}", url: "${GIT_REPO}", credentialsId: 'GitHubAccessToken'
                }
            }
        }

        stage('Secrets Scan - Gitleaks') {
            steps {
                echo "🔐 Running Gitleaks secret scan..."
                dir('arivihan_internal_metrics_frontend_application') {
                    sh '''
                        gitleaks detect --no-git --report-format json --report-path ../gitleaks-report.json || true
                        echo "✅ Gitleaks scan summary:"
                        jq '.[] | {Description, File, Line}' ../gitleaks-report.json || echo "No secrets found"
                    '''
                }
            }
        }

        stage('Build Frontend Application') {
            steps {
                dir('arivihan_internal_metrics_frontend_application') {
                    sh """
                    node -v
                    npm -v
                    npm install -f
                    npm run build
                    """
                }
            }
        }

        stage('SAST - Semgrep') {
            steps {
                echo "🧠 Running Semgrep static analysis..."
                dir('arivihan_internal_metrics_frontend_application') {
                    sh '''
                       semgrep --config p/ci --no-git-ignore --max-target-bytes=2500000 --json > ../semgrep-report.json || true
                    '''
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                echo "🔍 Running SonarQube analysis..."
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    dir('arivihan_internal_metrics_frontend_application') {
                        sh '''
                          sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.projectName=${SONAR_PROJECT_KEY} \
                                -Dsonar.sources=src \
                                -Dsonar.exclusions=node_modules/**,dist/**,build/** \
                                -Dsonar.tests= \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=${SONAR_TOKEN}
                        '''
                    }
                }
            }
        }  
        
        stage('Build Image') {
            steps {
                dir('arivihan_internal_metrics_frontend_application'){

                    script {
                        def date = new Date().format("yyyyMMdd")
                        env.IMAGE_TAG = "${date}-${BUILD_NUMBER}"
                        env.FULL_IMAGE_NAME = "${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
                        env.CACHE_REPO = "${ECR_REGISTRY}/jenkins-cache"
                        
                        // Set environment-specific variables
                        if (params.ENVIRONMENT == 'production') {
                            env.VITE_API_BASE_URL = 'https://platform.arivihan.com/internal-metrics'
                            env.VITE_SIDEBAR_API_URL = 'https://api.arivihan.com/sidebar-data'
                            env.VITE_DASHBOARD_SERVICES_API_URL = 'https://api.arivihan.com/dashboard-services'
                        } else if (params.ENVIRONMENT == 'staging') {
                            env.VITE_API_BASE_URL = 'https://platform-staging.arivihan.com/internal-metrics'
                            env.VITE_SIDEBAR_API_URL = 'https://api-staging.arivihan.com/sidebar-data'
                            env.VITE_DASHBOARD_SERVICES_API_URL = 'https://api-staging.arivihan.com/dashboard-services'
                        } else {
                            env.VITE_API_BASE_URL = 'https://platform-dev.arivihan.com/internal-metrics'
                            env.VITE_SIDEBAR_API_URL = '/secure/ui/fetch-component-configs/drawer-items'
                            env.VITE_DASHBOARD_SERVICES_API_URL = 'https://platform-dev.arivihan.com/dashboard-services'
                        }
                        
                        echo "🌍 Building for environment: ${params.ENVIRONMENT}"
                        echo "🔗 API Base URL: ${env.VITE_API_BASE_URL}"
                    }

                    container(name: 'builder') {
                        sh """
                            echo "🧱 Building image ${FULL_IMAGE_NAME} using Buildah..."
                            aws ecr get-login-password --region ${AWS_REGION} | buildah login --username AWS --password-stdin ${ECR_REGISTRY}

                            buildah bud \
                                --cache-from ${CACHE_REPO} \
                                --cache-to ${CACHE_REPO} \
                                --jobs 100 \
                                --layers \
                                --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL} \
                                --build-arg VITE_SIDEBAR_API_URL=${VITE_SIDEBAR_API_URL} \
                                --build-arg VITE_DASHBOARD_SERVICES_API_URL=${VITE_DASHBOARD_SERVICES_API_URL} \
                                -t ${FULL_IMAGE_NAME} \
                                -f ${DOCKERFILE_PATH} .
                        """
                    }
                }
            }
        }

        stage('Scan Image with Trivy') {
            steps {
                dir('arivihan_internal_metrics_frontend_application') {
                    container(name: 'builder') {
                        script {
                            sh '''
                                sleep 30
                                echo "📦 Exporting Buildah image as OCI archive..."
                                mkdir -p /tmp/oci-image
                                buildah push ${FULL_IMAGE_NAME} oci:/tmp/oci-image:latest
        
                                echo "🔍 Running Trivy on exported OCI image..."
                                trivy image \
                                    --input /tmp/oci-image \
                                    --scanners vuln \
                                    --timeout 10m \
                                    --severity HIGH,CRITICAL \
                                    --ignore-unfixed \
                                    --format json \
                                    --output ../trivy-report.json \
                                    --no-progress || true
        
                                echo "✅ Trivy scan completed. Report saved at trivy-report.json"
                                rm -rf /tmp/oci-image
                            '''
                        }
                    }
                }
            }
        }

        stage('Push Image to ECR') {
            steps {
                container(name: 'builder') {
                    sh """
                        echo "🚀 Pushing ${FULL_IMAGE_NAME} to ECR..."

                        # Login to ECR
                        aws ecr get-login-password --region ${AWS_REGION} | buildah login --username AWS --password-stdin ${ECR_REGISTRY}

                        # Push the built image
                        buildah push ${FULL_IMAGE_NAME}
                    """
                }
            }
        }
        
    }

    post {
        always {
            echo "📦 Archiving security reports..."
            archiveArtifacts artifacts: '*.json', allowEmptyArchive: true
        }
        success {
            echo "✅ Pipeline completed successfully."
        }
        failure {
            echo "❌ Pipeline failed. Check console logs and reports."
        }
    }
}
