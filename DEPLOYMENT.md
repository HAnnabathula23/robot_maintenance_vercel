# GitHub and Vercel deployment

This project is set up as a Vite/React app so Vercel can deploy it as a fast public website.

## deploy on Vercel

1. Create a public GitHub repository.
2. Push this `Robot Maintenance` folder to that repository.
3. Go to Vercel.
4. Connect your GitHub account.
5. Choose the repo.
6. Set the root directory to `robot_maintenance_vercel`.
7. Keep the framework preset as `Vite`.
8. Use `npm run build` as the build command.
9. Use `dist` as the output directory.
10. Deploy.

After that, you can submit both links:

- GitHub repo link
- Vercel public app link

## commands from this folder

```bash
git init
git add .
git commit -m "build robot predictive maintenance dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## local frontend run command

```bash
cd robot_maintenance_vercel
npm install
npm run dev
```

## optional python prototype run command

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

## what not to upload

Do not upload `.venv`. It is just the local Python environment with downloaded packages.

Vercel will use `robot_maintenance_vercel/package.json` for the frontend install. The Python files can stay in the repo as supporting artifacts, but Vercel will not run them for this static dashboard.
