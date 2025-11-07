output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.this.address
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
