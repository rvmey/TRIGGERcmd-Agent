pipeline {
    agent any

    options {
        skipDefaultCheckout()
    }

    stages {
        
     stage('prepare') {
        steps {
            checkout([
                $class: 'GitSCM',
                braches: [[name: '/master']],
                userRemoteConfigs: [[
                    credentialsId: "a7c75109-0dcd-43b2-98ac-055a02d9bcc8",
                    url: 'git@github.com:rvmey/TRIGGERcmd-Agent.git'
                ]]
            ])
        }
     }

        stage('build ubuntu') {
            agent {
                docker {
                    image 'node:20-alpine'
                    args '-u root'
                    reuseNode true
                }
            }

            steps {
                sh './ubuntubuild.sh'
            }
        }

        stage('copy artifacts') {
            steps {
                sh 'cp -r ./out/make/* /mnt/nas/TriggerCMD/'
            }
        }
    }
}
