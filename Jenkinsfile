pipeline {
	agent {
        docker {
            label 'slave-docker-7.7'
            image 'node:12'
        }
    }

    options {
        disableConcurrentBuilds()
    }

	stages {
		stage('Checkout') {
			steps {
				checkout scm
			}
		}

        stage('Setup') {
            options {
				timeout(time: 1, unit: 'HOURS')
			}

			steps {
                sh 'mkdir -p .yarn'
                sh 'yarn config set cache-folder .yarn'
                sh 'yarn install --frozen-lockfile'
			}
        }

        stage('Test') {
			options {
				timeout(time: 1, unit: 'HOURS')
			}

			steps {
                sh 'ls -la && ls -la packages/*'
                sh 'yarn test'
			}
		}
	}

	post {
        always {
            deleteDir()
        }
    }
}
