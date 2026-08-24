# ORO diagrams as code

`oro_observability_architecture.py` is the source of truth for the ORO Observability solution architecture image. It uses the Python [Diagrams](https://diagrams.mingrammer.com/) package and AWS node icons; the generated image is committed so it renders in GitHub and other Markdown viewers.

Prerequisites: Python 3, Graphviz, and the pinned package below. These tools are only needed when the architecture changes; they are not application dependencies.

```sh
python3 -m venv docs/diagrams/.venv
docs/diagrams/.venv/bin/python -m pip install -r docs/diagrams/requirements.txt
docs/diagrams/.venv/bin/python docs/diagrams/oro_observability_architecture.py
```

The render command updates `docs/images/oro-observability-architecture.png`. Review the generated image and commit it together with its Python source whenever the architecture changes.
