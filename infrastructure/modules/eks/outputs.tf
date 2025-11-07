output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_ca" {
  description = "EKS cluster CA data"
  value       = module.eks.cluster_certificate_authority_data
}
output "node_security_group_id" {
  description = "Security group ID used by EKS worker nodes"
  value       = module.eks.node_security_group_id
}
