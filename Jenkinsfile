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
                    image 'node:23.5-bullseye'
                    args '-u root'
                    reuseNode true
                }
            }

            steps {
                sh './ubuntubuild.sh'
            }
        }

        stage('copy rpm and deb artifacts') {
            steps {
                sh 'cp -r ./out/make/* /mnt/nas/TriggerCMD/'
            }
        }

        stage('copy rpi deb artifact') {
            steps {
                sh 'cp -r ./triggercmdagent_1.0.1_all.deb /mnt/nas/TriggerCMD/'
            }
        }

    }
}
