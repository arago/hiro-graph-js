pipeline {
	agent {
        docker {
            label 'slave-docker-7.7'
            image 'node:12'
            args '-v yarn_cache:/.cache/yarn'
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
            sh 'rm -rf yarn_cache'
            deleteDir()
        }
    }
}
