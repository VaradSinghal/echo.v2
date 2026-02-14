---
description: Run the end-to-end Echo Agent hackathon simulation (Post -> PR)
---
This workflow runs the `hackathon_simulation.py` script, which demonstrates the full autonomous pipeline of the Echo Agent.

**What this simulation does:**
1.  **Post Creation**: Automatically creates a new monitored post in Supabase about a feature request.
2.  **Feedback Injection**: Adds simulated user feedback (comment) to that post.
3.  **LLM Analysis**: Triggers the backend analysis to classify sentiment and actionable summary.
4.  **Agent Dispatch**: Launches the autonomous code generation task for the `VaradSinghal/test-repo`.
5.  **PR Creation**: Creates a Pull Request on GitHub and enhances it with `pr-agent`.

### Steps to Run:

1. Ensure the Python backend is running:
   ```powershell
   cd python_backend
   .\venv\Scripts\python -u main.py
   ```

2. Run the simulation script:
// turbo
   ```powershell
   cd python_backend
   .\venv\Scripts\python hackathon_simulation.py
   ```

3. Monitor the output in the terminal and check your dashboard at `http://localhost:3000/dashboard/agent` to see the real-time progression.
