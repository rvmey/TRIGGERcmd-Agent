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
                    credentialsId: "jenkins",
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
