pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    tools {
    'org.jenkinsci.plugins.nodejs.tools.NodeJSInstallation' 'NodeJS_18'
    }

    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test -- --watchAll=false'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Archive Build') {
            steps {
                archiveArtifacts artifacts: 'build/**', fingerprint: true
            }
        }

        // Optional: Deployment stage
        stage('Deploy') {
            steps {
                echo 'Deploying to server...'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
