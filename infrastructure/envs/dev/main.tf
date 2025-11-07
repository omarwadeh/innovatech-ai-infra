locals {
  common_tags = {
    Project = var.project
    Env     = var.env
    Owner   = "Innovatech"
  }
}

module "vpc" {
  source   = "../../modules/vpc"
  project  = var.project
  env      = var.env
  region   = var.region
  vpc_cidr = var.vpc_cidr
  tags     = local.common_tags
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnets" {
  value = module.vpc.public_subnets
}

output "private_subnets" {
  value = module.vpc.private_subnets
}
