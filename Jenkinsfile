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
                sh '''
                    set -eu
                    version=$(awk -F '"' '/"version"/ { print $4; exit }' package.json)
                    rpm_src=$(find ./out/make -type f -name "triggercmdagent-${version}-1.x86_64.rpm" | head -n 1)
                    deb_src=$(find ./out/make -type f -name "triggercmdagent_${version}_amd64.deb" | head -n 1)

                    [ -n "$rpm_src" ] || { echo "RPM artifact not found"; exit 1; }
                    [ -n "$deb_src" ] || { echo "DEB artifact not found"; exit 1; }

                    cp "$rpm_src" /mnt/nas/TriggerCMD/
                    cp "$deb_src" /mnt/nas/TriggerCMD/

                    cp "$rpm_src" /mnt/nas/TriggerCMD/triggercmdagent-1.0.1.x86_64.rpm
                    cp "$deb_src" /mnt/nas/TriggerCMD/triggercmdagent_1.0.1_amd64.deb
                '''
            }
        }

        stage('copy rpi deb artifact') {
            steps {
                sh 'cp ./triggercmdagent_1.0.1_all.deb /mnt/nas/TriggerCMD/'
            }
        }

        stage('cleanup') {
            agent {
                docker {
                    image 'node:23.5-bullseye'
                    args '-u root'
                    reuseNode true
                }
            }

            steps {
                sh 'rm -rf ./out && rm -rf ./node_modules'
            }
        }
        
    }
}
