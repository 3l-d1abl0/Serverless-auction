resource "aws_cloudwatch_event_rule" "process_auctions" {
  name                = "${local.service_name}-process-auctions-${var.environment}"
  description         = "Process auctions every minute"
  schedule_expression = var.process_auctions_schedule

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "process_auctions" {
  rule      = aws_cloudwatch_event_rule.process_auctions.name
  target_id = "ProcessAuctions"
  arn       = aws_lambda_function.handlers["processAuctions"].arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handlers["processAuctions"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.process_auctions.arn
}
