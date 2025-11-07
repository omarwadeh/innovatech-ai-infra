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

  # Basis cluster settings
  cluster_name    = "${var.project}-${var.env}-eks"
  cluster_version = "1.29"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  enable_irsa = true

  # DEV: API endpoint publiek zodat je vanaf je laptop erbij kunt
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = false
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]

  # Managed node group (simple lab setup)
  eks_managed_node_groups = {
    default = {
      desired_size = 2
      min_size     = 1
      max_size     = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  # Nieuwe manier: EKS Access Entries (Cluster Access Management)
  # Geef jouw Fontys SSO rol volledige cluster-admin rechten
  access_entries = {
    fontys-admin = {
      principal_arn = "arn:aws:iam::280348121871:role/AWSReservedSSO_fictisb_IsbUsersPS_053963393f75c60c"

      policy_associations = {
        admin = {
          # Standaard EKS cluster admin policy
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  tags = var.tags
}
