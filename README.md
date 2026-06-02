# Forge
## FSMOne Fund Price Monitor

Endpoint: `GET /api/v1/fund-price?fund=<fund>&slug=<slug>`

| Fund Name | `fund` | `slug` |
|---|---|---|
| Kenanga Asia Pacific Total Return Fund | `MYKNGAPTR` | `kenanga-asia-pacific-total-return-fund` |
| RHB Global Artificial Intelligence Fund (MYR Hedged) | `MYRGSIFMH` | `rhb-global-artificial-intelligence-fund-myr-hedged` |
| AmChina A-Shares MYR | `MYAMCHSHMY` | `amchina-a-shares-myr` |

```bash
curl "http://localhost:3000/api/v1/fund-price?fund=MYKNGAPTR&slug=kenanga-asia-pacific-total-return-fund"
curl "http://localhost:3000/api/v1/fund-price?fund=MYRGSIFMH&slug=rhb-global-artificial-intelligence-fund-myr-hedged"
curl "http://localhost:3000/api/v1/fund-price?fund=MYAMCHSHMY&slug=amchina-a-shares-myr"
```

> To add a new fund: find the factsheet on fsmone.com.my, copy the `slug` (path after `/factsheet/`) and `fund` query param — no code changes needed.

---

## Todo

### Todo 1

Scheduler pull the data and store mongodb or anything ?

sequence:

1. express > Scheduler > news > store db / cache
2. User > API > cache > db
3. User > API > cache > db > news > store db / cache (if dont have db / cache)

api pulling the data from db

### Todo 2

new api to fetch the news list

1. add https://sspai.com/
2. add https://hackernoon.com/
3. add https://blog.bytebytego.com/
