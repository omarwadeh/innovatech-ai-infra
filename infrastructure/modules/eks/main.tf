terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name    = "${var.project}-${var.env}-eks"
  cluster_version = "1.29"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  enable_irsa = true

  eks_managed_node_groups = {
    default = {
      desired_size = 2
      min_size     = 1
      max_size     = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  tags = var.tags
}
