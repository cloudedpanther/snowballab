# Snowballlab

복리 계산기 기반 유틸 사이트.

## Commands

| Command           | Action                               |
| :---------------- | :----------------------------------- |
| `npm install`     | Install dependencies                 |
| `npm run dev`     | Start local dev server               |
| `npm run build`   | Build production site to `./dist/`   |
| `npm run preview` | Preview the production build locally |
| `npm run check`   | Run format, lint, and type checks    |
| `npm run test`    | Run calculation regression tests     |

## Deployment (GitHub Pages + Custom Domain)

- Custom domain: `snowballlab.co.kr`
- `public/CNAME` contains the domain.
- GitHub Actions workflow deploys `dist` on pushes to `master`.

### Checklist

1. GitHub Pages 설정에서 **Custom domain**에 `snowballlab.co.kr` 입력
2. DNS 설정
   - `A` 레코드: GitHub Pages IP (공식 문서 참고)
   - `CNAME` 레코드: `www` → `snowballlab.co.kr`
3. HTTPS 활성화 확인
