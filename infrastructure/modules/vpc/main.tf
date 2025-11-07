terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  name = "${var.project}-${var.env}-vpc"
  cidr = var.vpc_cidr

  azs = [
    "${var.region}a",
    "${var.region}b",
    "${var.region}c",
  ]

  public_subnets = [
    "10.20.1.0/24",
    "10.20.2.0/24",
    "10.20.3.0/24",
  ]

  private_subnets = [
    "10.20.11.0/24",
    "10.20.12.0/24",
    "10.20.13.0/24",
  ]

  enable_nat_gateway = true
  single_nat_gateway = true

  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(
    var.tags,
    { Name = "${var.project}-${var.env}-vpc" }
  )
}
