terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_db_subnet_group" "this" {
  name       = "innovatech-rds-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "innovatech-rds-sg"
  description = "Allow DB access from EKS nodes"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "this" {
  identifier        = "innovatech-hrdb-dev"

  engine            = "postgres"
  # Laat engine_version weg -> AWS kiest een ondersteunde versie voor je regio
  # engine_version  = "15.4"

  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "hrdb"
  username = "innovatech_admin"
  password = "VerySecure123!"  # (later netjes naar Secrets Manager)

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false
  publicly_accessible = false
  skip_final_snapshot = true
}
