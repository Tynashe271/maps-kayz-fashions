class ExampleWorker
  include Sidekiq::Job

  def perform(message)
    logger.info("processed message=#{message.inspect}")
  end
end
