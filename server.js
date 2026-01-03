// Add this route for session validation
app.post('/api/validate-session', (req, res) => {
    const { session_id } = req.body;
    const sessionValidator = require('./src/sessionValidator');
    
    if (!session_id) {
        return res.json({
            valid: false,
            error: 'No session ID provided',
            format: 'KIHDAH:~[16 hex characters]',
            example: 'KIHDAH:~A1B2C3D4E5F67890'
        });
    }
    
    const extracted = sessionValidator.extractSessionId(session_id);
    const isValid = sessionValidator.validateSessionId(extracted);
    
    if (isValid) {
        res.json({
            valid: true,
            session_id: extracted,
            message: '✅ Valid KIHDAH:~ session ID',
            format: 'KIHDAH:~[16 hex characters]'
        });
    } else {
        res.json({
            valid: false,
            error: 'Invalid session format',
            received: session_id.substring(0, 50) + '...',
            required_format: 'KIHDAH:~[16 hex characters]',
            example: 'KIHDAH:~A1B2C3D4E5F67890',
            get_session: 'https://xgurupairing1-b1268276f8b5.herokuapp.com/pair'
        });
    }
});

// Update web panel to show strict requirements
app.get('/panel', (req, res) => {
    const sessionValidator = require('./src/sessionValidator');
    const rules = sessionValidator.getRules();
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>KIH DAH Bot - Session Validation</title>
        <style>
            .valid { color: #25D366; }
            .invalid { color: #FF6B6B; }
            .kihdah-format {
                background: #1a1a1a;
                color: #4ECDC4;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                margin: 10px 0;
            }
            .rule-box {
                border: 2px solid #333;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <h1>🔐 KIH DAH Session Validation</h1>
        
        <div class="rule-box">
            <h3>⚠️ STRICT SESSION FORMAT REQUIRED</h3>
            <p>Only sessions starting with <b>KIHDAH:~</b> are accepted</p>
        </div>
        
        <h3>Required Format:</h3>
        <div class="kihdah-format">
            ${rules.format}
        </div>
        
        <h3>Example:</h3>
        <div class="kihdah-format">
            ${rules.example}
        </div>
        
        <h3>Get Valid Session:</h3>
        <a href="https://xgurupairing1-b1268276f8b5.herokuapp.com/pair" 
           style="background: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           🔗 Generate KIHDAH:~ Session
        </a>
        
        <h3>Validate Your Session:</h3>
        <form id="validateForm">
            <textarea id="sessionInput" placeholder="Paste your KIHDAH:~ session ID here" 
                      style="width: 100%; height: 100px; padding: 10px;"></textarea>
            <button type="submit" style="padding: 10px 20px; background: #25D366; color: white; border: none; margin-top: 10px;">
                Validate Session
            </button>
        </form>
        
        <div id="result"></div>
        
        <script>
            document.getElementById('validateForm').onsubmit = async (e) => {
                e.preventDefault();
                const session = document.getElementById('sessionInput').value;
                
                const response = await fetch('/api/validate-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: session })
                });
                
                const result = await response.json();
                const resultDiv = document.getElementById('result');
                
                if (result.valid) {
                    resultDiv.innerHTML = \`
                        <div style="background: #25D36620; padding: 15px; border-radius: 5px; margin-top: 10px;">
                            <h3 style="color: #25D366">✅ Valid Session</h3>
                            <p><b>Session ID:</b> <code>\${result.session_id}</code></p>
                            <p>\${result.message}</p>
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div style="background: #FF6B6B20; padding: 15px; border-radius: 5px; margin-top: 10px;">
                            <h3 style="color: #FF6B6B">❌ Invalid Session</h3>
                            <p><b>Error:</b> \${result.error}</p>
                            <p><b>Received:</b> <code>\${result.received}</code></p>
                            <p><b>Required Format:</b> \${result.required_format}</p>
                            <p><b>Example:</b> <code>\${result.example}</code></p>
                            <a href="\${result.get_session}" style="color: #FF6B6B">Get valid session →</a>
                        </div>
                    \`;
                }
            };
        </script>
    </body>
    </html>
    `);
});
