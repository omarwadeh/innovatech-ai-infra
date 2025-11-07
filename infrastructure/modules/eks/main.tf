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

  # Basis
  cluster_name    = "${var.project}-${var.env}-eks"
  cluster_version = "1.29"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  # IRSA voor pod-level IAM
  enable_irsa = true

  # DEV: EKS API publiek bereikbaar zodat jij met kubectl kunt verbinden
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = false

  # DEV: open voor alle IP's (voor productie beperken!)
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]

  # Managed node group
  eks_managed_node_groups = {
    default = {
      desired_size = 2
      min_size     = 1
      max_size     = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  # Toegang voor jouw Fontys SSO rol (cluster-admin)
  access_entries = {
    fontys-admin = {
      principal_arn = "arn:aws:iam::280348121871:role/AWSReservedSSO_fictisb_IsbUsersPS_053963393f75c60c"

      kubernetes_groups = [
        "system:masters"
      ]
    }
  }

  tags = var.tags
}
