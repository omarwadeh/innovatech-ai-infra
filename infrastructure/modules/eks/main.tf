terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

# IAM role die we als EKS-clusteradmin gebruiken
# Alleen jouw Fontys SSO rol mag deze assumen
resource "aws_iam_role" "eks_admin" {
  name = "${var.project}-${var.env}-eks-admin"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::280348121871:role/AWSReservedSSO_fictisb_IsbUsersPS_053963393f75c60c"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
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

  # DEV: publieke endpoint zodat je vanaf thuis kunt verbinden
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = false
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]

  # Managed node group (simpel, genoeg voor lab)
  eks_managed_node_groups = {
    default = {
      desired_size = 2
      min_size     = 1
      max_size     = 3

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  # Gebruik nieuwe EKS Access Entries:
  # koppel onze eigen eks_admin rol als cluster admin
  access_entries = {
    eks-admin = {
      principal_arn = aws_iam_role.eks_admin.arn

      policy_associations = {
        admin = {
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
