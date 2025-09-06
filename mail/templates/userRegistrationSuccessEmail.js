const userRegistrationSuccessEmail = (name) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to AI Ticket Raiser</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #000; /* black strip background */
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .wrapper {
      padding: 40px 0; /* top and bottom black strip */
    }

    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff; /* white content box */
      padding: 40px 30px;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      color: #000000; /* black text */
      text-align: left;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .content {
      font-size: 16px;
      line-height: 1.6;
    }

    .tips {
      margin-top: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-left: 4px solid #000;
      border-radius: 8px;
    }

    .tips ul {
      margin: 0;
      padding-left: 20px;
    }

    .cta {
      display: inline-block;
      margin-top: 30px;
      background-color: #000000;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.3s ease-in-out;
    }

    .cta:hover {
      background-color: #333333;
    }

    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #555;
      text-align: center;
    }

    a {
      color: #000;
      text-decoration: underline;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="container">
      <div class="title">Welcome to AI Ticket Raiser, ${name}!</div>

      <div class="content">
        <p>🎉 Your account has been created successfully.</p>
        <p>AI Ticket Raiser helps you submit, track and resolve issues effortlessly with the power of AI.</p>

        <div class="tips">
          <strong>🚀 Quick Tips to Get Started:</strong>
          <ul>
            <li>🎫 Click “New Ticket” to raise your first support ticket instantly.</li>
            <li>🤖 Use our AI suggestions to auto-fill issue details.</li>
            <li>📊 Track ticket progress and updates in real time.</li>
            <li>📨 Receive email notifications as your tickets move forward.</li>
          </ul>
        </div>

        <a class="cta" href="https://my.com/dashboard">Go to Dashboard</a>
      </div>

      <div class="footer">
        Need help? Reach us at 
        <a href="mailto:chaipiladona@gmail.com">chaipiladona@gmail.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export default userRegistrationSuccessEmail;
