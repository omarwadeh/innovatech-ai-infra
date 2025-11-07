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

module "eks" {
  source          = "../../modules/eks"
  project         = var.project
  env             = var.env
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  tags            = local.common_tags
}
module "rds" {
  source                = "../../modules/rds"
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnets
  node_security_group_id = module.eks.node_security_group_id
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

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}
