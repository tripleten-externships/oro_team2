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


class LargeClient(Client):
    _height = 2.4


class LargeWAF(WAF):
    _height = 2.6


class LargeCloudFront(CloudFront):
    _height = 2.6


class LargeCognito(Cognito):
    _height = 2.6


class LargeAmplify(Amplify):
    _height = 2.6


class LargeS3(S3):
    _height = 2.6


class LargeLambda(Lambda):
    _height = 2.6


class LargeDynamodb(Dynamodb):
    _height = 2.6


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_IMAGE = REPOSITORY_ROOT / "docs" / "images" / "oro-observability-architecture.png"
RAW_OUTPUT = OUTPUT_IMAGE.with_name(".oro-observability-architecture-render")
RAW_IMAGE = RAW_OUTPUT.with_suffix(".png")

GRAPH_ATTRIBUTES = {
    "size": "16,9!",
    "ratio": "fill",
    "pad": "0.25",
    "nodesep": "0.4",
    "ranksep": "0.7",
    "splines": "spline",
    "fontname": "Arial",
    "fontsize": "26",
    "fontcolor": "#253547",
    "labelloc": "t",
    "labeljust": "l",
    "label": (
        "ORO Observability MVP · Solution architecture\\n"
        "Solid arrows show request or data flow. Dashed arrows show administrator authentication."
    ),
}

NODE_ATTRIBUTES = {
    "fontname": "Arial",
    "fontsize": "20",
    "fontcolor": "#253547",
    "width": "1.9",
    "imagescale": "true",
}

EDGE_ATTRIBUTES = {
    "fontname": "Arial",
    "fontsize": "15",
    "color": "#232F3E",
    "fontcolor": "#232F3E",
    "penwidth": "2.2",
    "arrowsize": "0.9",
}

AUTH_EDGE = {
    "style": "dashed",
    "color": "#5B6470",
    "fontcolor": "#5B6470",
}

AWS_CLOUD_ATTRIBUTES = {
    "bgcolor": "#FFFFFF",
    "pencolor": "#253547",
    "penwidth": "2.5",
    "fontsize": "24",
    "fontname": "Arial",
    "fontcolor": "#253547",
    "margin": "28",
}

ACCOUNT_ATTRIBUTES = {
    "bgcolor": "#FFFFFF",
    "pencolor": "#253547",
    "penwidth": "2",
    "fontsize": "21",
    "fontname": "Arial",
    "fontcolor": "#253547",
    "margin": "22",
}

AUTHENTICATION_ATTRIBUTES = {
    "bgcolor": "#FFFFFF",
    "pencolor": "#6B7C93",
    "penwidth": "1.8",
    "style": "dashed",
    "fontsize": "18",
    "fontname": "Arial",
    "fontcolor": "#253547",
    "margin": "18",
}

SERVICE_ATTRIBUTES = {
    "width": "2.0",
}

CLIENT_ATTRIBUTES = {
    "width": "1.8",
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
    homeowner = LargeClient("Homeowner", **CLIENT_ATTRIBUTES)
    administrator = LargeClient("ORO administrator", **CLIENT_ATTRIBUTES)

    with Cluster("AWS Cloud", graph_attr=AWS_CLOUD_ATTRIBUTES):
        waf = LargeWAF("AWS WAF", **SERVICE_ATTRIBUTES)
        cloudfront = LargeCloudFront("Amazon CloudFront", **SERVICE_ATTRIBUTES)

        with Cluster("ORO AWS account · us-east-1", graph_attr=ACCOUNT_ATTRIBUTES):
            with Cluster("Admin authentication", graph_attr=AUTHENTICATION_ATTRIBUTES):
                cognito = LargeCognito("Amazon Cognito", **SERVICE_ATTRIBUTES)

            amplify = LargeAmplify("AWS Amplify", **SERVICE_ATTRIBUTES)
            admin_assets = LargeS3("Admin assets", **SERVICE_ATTRIBUTES)
            ingest = LargeLambda("Ingest Lambda", **SERVICE_ATTRIBUTES)
            events = LargeDynamodb("DynamoDB events", **SERVICE_ATTRIBUTES)
            admin_api = LargeLambda("Admin Lambda", **SERVICE_ATTRIBUTES)
            exports = LargeS3("CSV exports", **SERVICE_ATTRIBUTES)

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
