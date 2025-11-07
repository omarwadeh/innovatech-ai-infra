variable "vpc_id" {
  description = "VPC ID where RDS will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for RDS subnet group"
  type        = list(string)
}

variable "node_security_group_id" {
  description = "Security group of EKS nodes allowed to reach RDS"
  type        = string
}
