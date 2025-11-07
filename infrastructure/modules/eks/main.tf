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

  # DEV: API endpoint publiek zodat je vanaf je laptop erbij kunt
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = false
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

  # Gebruik klassieke aws-auth configmap om IAM -> Kubernetes te mappen
  manage_aws_auth_configmap = true

  aws_auth_roles = [
    # GitHub Actions role: was cluster creator, maar zetten we expliciet erbij als admin (pas ARN als nodig)
    {
      rolearn  = "arn:aws:iam::280348121871:role/GithubTerraformDevRole"
      username = "github-terraform"
      groups   = ["system:masters"]
    },
    # Jouw Fontys SSO rol: geef cluster-admin rechten
    {
      rolearn  = "arn:aws:iam::280348121871:role/AWSReservedSSO_fictisb_IsbUsersPS_053963393f75c60c"
      username = "fontys-admin"
      groups   = ["system:masters"]
    }
  ]

  tags = var.tags
}
