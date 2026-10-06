# n8n-nodes-namegender

An [n8n](https://n8n.io) community node for [NameGender](https://namegender.com). It returns the gender associated with a name, email address or username, together with the evidence behind the answer: probability, sample size, confidence and source. It also returns the first, middle and last name parsed from the input.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Output](#output) · [Resources](#resources)

## Installation

In n8n, open **Settings → Community Nodes → Install** and enter `n8n-nodes-namegender`. See the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) for self-hosted setups.

## Credentials

1. Create a free account at [namegender.com](https://namegender.com/register). No card is needed, and every account gets 100 free credits a day.
2. In the dashboard, open **API keys** and create a key. It starts with `ng_live_`.
3. In n8n, add a **NameGender API** credential and paste the key. Testing the credential calls `/me`, which is not charged.

If the names are personal data you do not want kept in your request history, turn on **Don't store the names this key sends** for the key.

## Operations

The node has three resources: **Gender** (the four lookups below), **Salutation** and **Name Check**. Workflows built before 0.4.0 keep working: Gender is the default resource.

| Operation | Endpoint | Input |
|---|---|---|
| Gender From Name | `POST /api/v1/gender` | A first name or a full name |
| Gender From Email | `POST /api/v1/gender/email` | An email address |
| Gender From Username | `POST /api/v1/gender/username` | A username or handle |
| Countries For Name | `POST /api/v1/gender/countries` | A first name |
| Name Check | `POST /api/v1/name-check` | A name as typed into a form |
| Salutation | `POST /api/v1/salutation` | A full name, titles included |

The three gender operations accept an optional two-letter **Country Code**, which matters for names that change gender across borders, and **Best Guess**, which returns the most likely gender even below the confidence threshold.

**Salutation** turns a name into a ready letter or email salutation in ten languages: `Dr. Anna Müller` in German gives `Sehr geehrte Frau Dr. Müller,`, `Ahmet Yılmaz` in Turkish `Sayın Ahmet Bey,`. The output has `salutation.formal`, `salutation.informal` and `salutation.neutral`. The gendered form is used only when the gender is known with at least the **Minimum Probability** (default 90) and the language has the name part it needs; otherwise `form` is `neutral` and `reason` says why. Set **Language**, a **Country Code** for the lookup, or **Known Gender** when your data already has it.

**Name Check** says whether a name typed into a form looks like a real person's name, with the reasons: `asdf qwerty` comes back `implausible` with `keyboard_pattern`, `Jennifer Null` comes back `plausible`. The output has `assessment` (`plausible`, `suspicious` or `implausible`), a `score` from 0 to 100 and the `signals` behind it. It never calls a name fake: use it to flag a record or route it for review, not to reject people automatically. Surnames are judged by their shape only.

Each incoming item costs one credit, including items that come back unknown.

## Output

```json
{
  "query": "Ayşe Yılmaz",
  "name": "Ayşe",
  "first_name": "Ayşe",
  "middle_name": null,
  "last_name": "Yılmaz",
  "name_type": "personal",
  "gender": "female",
  "probability": 99,
  "sample_size": 655,
  "confidence": "high",
  "source": "db",
  "matched_as": null,
  "country": null,
  "credits_remaining": 4821
}
```

`gender: null` is a successful answer that means the data has no confident gender for that name. Route it with an **IF** node instead of treating it as an error. Read `probability` together with `sample_size` before trusting a result.

A name tells you how often people with that name were recorded as male or female. It does not tell you how a person identifies. Do not use it for decisions about employment, credit, insurance, health or eligibility.

## Resources

- [API documentation](https://namegender.com/docs)
- [Response fields explained](https://namegender.com/blog/probability-confidence-and-sample-size)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

MIT
