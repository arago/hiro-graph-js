pipeline {
	agent {
        node {
            label 'slave-docker-7.7'
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

    stage('Test') {
            agent {
                docker {  image 'node:12-alpine' }
            }

			options {
				timeout(time: 1, unit: 'HOURS')
			}

			steps {
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
