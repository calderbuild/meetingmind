from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MeetingMind API"

    # EverMemOS
    evermemos_mode: str = "mock"  # mock | cloud
    evermemos_base_url: str = "https://api.evermind.ai"
    evermemos_api_key: str = ""

    # OpenAI
    openai_api_key: str = ""
    openai_base_url: str = ""
    llm_model_analysis: str = "gpt-4o"
    llm_model_stream: str = "gpt-4o-mini"

    # Security
    cors_origins: list[str] = ["http://localhost:3000"]
    api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
