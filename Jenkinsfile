pipeline {
	agent {
        docker {
            label 'slave-docker-7.7'
            image 'node:16'
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
                sh 'yarn test:ci'
			}
		}
	}

	post {
        always {
			junit 'reports/*.xml'
            deleteDir()
        }
    }
}
