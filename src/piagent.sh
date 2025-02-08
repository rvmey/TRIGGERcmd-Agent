#!/bin/bash
cd /usr/share/triggercmdagent/app
/usr/bin/env node src/agent.js --console "$@"