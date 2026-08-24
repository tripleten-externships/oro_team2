"""Render the ORO Observability solution architecture as a 16:9 image."""

from math import ceil
from pathlib import Path

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.mobile import Amplify
from diagrams.aws.network import CloudFront
from diagrams.aws.security import Cognito, WAF
from diagrams.aws.storage import S3
from diagrams.onprem.client import Client
from PIL import Image


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_IMAGE = REPOSITORY_ROOT / "docs" / "images" / "oro-observability-architecture.png"
RAW_OUTPUT = OUTPUT_IMAGE.with_name(".oro-observability-architecture-render")
RAW_IMAGE = RAW_OUTPUT.with_suffix(".png")

GRAPH_ATTRIBUTES = {
    "size": "16,9!",
    "ratio": "fill",
    "pad": "0.35",
    "nodesep": "0.6",
    "ranksep": "1.0",
    "splines": "spline",
    "fontname": "Arial",
    "fontsize": "22",
    "labelloc": "t",
    "labeljust": "l",
    "label": (
        "ORO Observability MVP | Solution architecture\\n"
        "Solid arrows: request or data flow. Dashed arrows: administrator authentication."
    ),
}

NODE_ATTRIBUTES = {
    "fontname": "Arial",
    "fontsize": "11",
}

EDGE_ATTRIBUTES = {
    "fontname": "Arial",
    "fontsize": "10",
    "color": "#232F3E",
    "fontcolor": "#232F3E",
}

AUTH_EDGE = {
    "style": "dashed",
    "color": "#5B6470",
    "fontcolor": "#5B6470",
}


with Diagram(
    name="ORO Observability solution architecture",
    filename=str(RAW_OUTPUT),
    outformat="png",
    show=False,
    direction="TB",
    graph_attr=GRAPH_ATTRIBUTES,
    node_attr=NODE_ATTRIBUTES,
    edge_attr=EDGE_ATTRIBUTES,
):
    homeowner = Client("Homeowner browser\nPublic app · no sign-in")
    administrator = Client("Administrator browser\n/oro-admin · access token")

    with Cluster("AWS Cloud"):
        waf = WAF("AWS WAF")
        cloudfront = CloudFront("CloudFront\nOnly public entry")

        with Cluster("Regional resources | us-east-1"):
            cognito = Cognito("Hosted UI\nAuthorization Code + PKCE\noro-admin group required")
            amplify = Amplify("Amplify Hosting\nPublic React application")
            admin_assets = S3("Admin assets\nPrivate bundle origin")
            ingest = Lambda("Ingest function\nValidates anonymous events\nCloudFront IP + geography")
            events = Dynamodb("Events table\nDaily GSI · 4 shards · 30-day TTL\nEncryption + PITR")
            admin_api = Lambda("Admin function\nBounded metrics + CSV\nValidates access token")
            exports = S3("Exports\nPrivate CSV · 24-hour expiry")

    homeowner >> Edge(label="public app") >> waf
    administrator >> Edge(label="admin page + API") >> waf
    administrator >> Edge(label="sign in · PKCE", **AUTH_EDGE) >> cognito
    cognito >> Edge(label="authorization return", **AUTH_EDGE) >> administrator

    waf >> cloudfront
    cloudfront >> Edge(label="/*") >> amplify
    cloudfront >> Edge(label="/oro-admin/*") >> admin_assets
    cloudfront >> Edge(label="/api/observability/events") >> ingest
    cloudfront >> Edge(label="/api/observability/admin/*") >> admin_api
    ingest >> Edge(label="conditional PutItem") >> events
    admin_api >> Edge(label="GSI queries") >> events
    admin_api >> Edge(label="CSV export · 24-hour TTL") >> exports


with Image.open(RAW_IMAGE) as rendered:
    source = rendered.convert("RGBA")
    source_ratio = source.width / source.height
    target_ratio = 16 / 9

    if source_ratio < target_ratio:
        canvas_size = (ceil(source.height * target_ratio), source.height)
    else:
        canvas_size = (source.width, ceil(source.width / target_ratio))

    canvas = Image.new("RGBA", canvas_size, "white")
    offset = ((canvas.width - source.width) // 2, (canvas.height - source.height) // 2)
    canvas.alpha_composite(source, offset)
    canvas.convert("RGB").save(OUTPUT_IMAGE, "PNG", optimize=True)

RAW_IMAGE.unlink()
