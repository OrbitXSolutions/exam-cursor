using Mapster;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.DTOs.Users;
using Smart_Core.Domain.Entities;

namespace Smart_Core.Infrastructure.Mapping;

public static class MappingConfig
{
    public static void RegisterMappings()
    {
// ApplicationUser to UserDto
  TypeAdapterConfig<ApplicationUser, UserDto>
     .NewConfig()
            .Map(dest => dest.Status, src => src.Status.ToString());

        // ApplicationUser to UserDetailDto
  TypeAdapterConfig<ApplicationUser, UserDetailDto>
    .NewConfig()
   .Map(dest => dest.Status, src => src.Status.ToString());
    }
}
